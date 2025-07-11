import { useFileUploader } from "@/hooks/useFileUploader";
import { useZipProcessor } from "@/hooks/useZipProcessor";
import { useFileProcessor } from "@/hooks/useFileProcessor";
import { useFileValidation } from "./FileValidation";
import { useToast } from "@/components/ui/use-toast";
import { FileUploadStatus } from "@/hooks/useFileUploader";
import { Category } from "@/types/fileTypes";
import { isZipFile } from "@/utils/zipUtils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface FileUploadHandlerProps {
  creatorId: string;
  currentFolder: string;
  onUploadComplete?: (uploadedFileIds?: string[]) => void;
  availableCategories?: Category[];
}

export const useFileUploadHandler = ({
  creatorId,
  currentFolder,
  onUploadComplete,
  availableCategories = []
}: FileUploadHandlerProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    isUploading,
    setIsUploading,
    fileStatuses,
    setFileStatuses,
    overallProgress,
    showProgress,
    setShowProgress,
    abortControllersRef,
    updateFileProgress,
    handleCancelUpload,
    MAX_FILE_SIZE_GB,
    CHUNK_SIZE
  } = useFileUploader({ 
    creatorId, 
    onUploadComplete, 
    currentFolder 
  });

  // Use file validation hook
  const { validateFiles, showValidationToasts } = useFileValidation(MAX_FILE_SIZE_GB);
  
  // Use hooks for file processing
  const { processZipFile } = useZipProcessor();
  const { processRegularFile } = useFileProcessor();

  // Function to get the destination string based on current folder and category
  const getDestinationString = async (currentFolder: string, zipCategoryId?: string) => {
    try {
      let categoryName = null;
      let folderName = null;

      // If we have a ZIP category ID, get the category name
      if (zipCategoryId) {
        const { data: categoryData, error: categoryError } = await supabase
          .from('file_categories')
          .select('category_name')
          .eq('category_id', zipCategoryId)
          .single();

        if (!categoryError && categoryData) {
          categoryName = categoryData.category_name;
        }
      }

      // If we have a current folder (not 'all' or 'unsorted'), get folder and category info
      if (currentFolder && currentFolder !== 'all' && currentFolder !== 'unsorted') {
        const { data: folderData, error: folderError } = await supabase
          .from('file_folders')
          .select(`
            folder_name,
            file_categories!inner(category_name)
          `)
          .eq('folder_id', currentFolder)
          .single();

        if (!folderError && folderData) {
          folderName = folderData.folder_name;
          if (!categoryName && folderData.file_categories) {
            categoryName = folderData.file_categories.category_name;
          }
        }
      }

      // Format the destination string
      if (categoryName && folderName) {
        return `${categoryName}>${folderName}`;
      } else if (categoryName) {
        return categoryName;
      } else if (folderName) {
        return folderName;
      } else {
        return "All Files";
      }
    } catch (error) {
      console.error('Error getting destination string:', error);
      return "All Files";
    }
  };

  // Add function to trigger webhook after upload completion
  const triggerUploadWebhook = async (uploadedFileIds: string[], currentFolder: string, zipCategoryId?: string) => {
    try {
      const destination = await getDestinationString(currentFolder, zipCategoryId);

      const webhookData = {
        email: user?.email || 'unknown@email.com',
        destination: destination,
        media_quantity: uploadedFileIds.length,
        time_uploaded: new Date().toISOString()
      };

      console.log('Triggering media upload webhook with data:', webhookData);

      const { error: webhookError } = await supabase.functions.invoke('media-upload-webhook', {
        body: webhookData
      });

      if (webhookError) {
        console.error('Error calling webhook:', webhookError);
      } else {
        console.log('Media upload webhook triggered successfully');
      }
    } catch (error) {
      console.error('Error in triggerUploadWebhook:', error);
    }
  };

  // Main file change handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement> & { zipCategoryId?: string }) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check if any files are ZIP files
    const fileArray = Array.from(files);
    const zipFiles = fileArray.filter(file => isZipFile(file.name));
    const hasZipFiles = zipFiles.length > 0;

    // If there are ZIP files, check if category is selected
    if (hasZipFiles && !e.zipCategoryId) {
      toast({
        title: "Category Required for ZIP Files",
        description: "Please select a category before uploading ZIP files.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setShowProgress(true);
    setFileStatuses([]);
    abortControllersRef.current.clear();
    
    try {
      // Get the category ID for zip files
      const zipCategoryId = e.zipCategoryId;
      
      console.log(`Starting upload with ${files.length} files, ZIP category: ${zipCategoryId}`);
      
      // Validate files and get results
      const validationResult = validateFiles(files);
      const { initialStatuses, validFiles } = validationResult;
      
      // Show relevant toasts based on validation
      showValidationToasts(validationResult);
      
      // Set initial file statuses
      setFileStatuses(initialStatuses as FileUploadStatus[]);
      
      if (initialStatuses.length === 0) {
        setIsUploading(false);
        e.target.value = '';
        return;
      }
      
      // Process the files
      const uploadedFileIds = await processFiles(validFiles.zipFiles, validFiles.regularFiles, zipCategoryId);
      
      // Show success message for successful uploads
      const successfulUploads = fileStatuses.filter(f => f.status === 'complete').length;
      if (successfulUploads > 0) {
        toast({
          title: successfulUploads > 1 
            ? `${successfulUploads} files uploaded` 
            : '1 file uploaded',
          description: `Successfully uploaded ${successfulUploads} files`,
        });
      }
      
      // Reset the input
      if (e.target.value) {
        e.target.value = '';
      }
      
      // Trigger webhook if files were uploaded successfully
      if (uploadedFileIds.length > 0) {
        await triggerUploadWebhook(uploadedFileIds, currentFolder, zipCategoryId);
      }
      
      // Call the callback if it exists
      if (onUploadComplete && uploadedFileIds.length > 0) {
        onUploadComplete(uploadedFileIds);
        
        // Hide progress after a delay
        setTimeout(() => {
          setShowProgress(false);
        }, 3000);
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload the file(s)',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Process both zip and regular files
  const processFiles = async (
    zipFiles: File[], 
    regularFiles: File[], 
    zipCategoryId?: string
  ): Promise<string[]> => {
    const uploadedFileIds: string[] = [];

    console.log(`Processing ${zipFiles.length} ZIP files and ${regularFiles.length} regular files`);

    // First handle the ZIP files
    for (const zipFile of zipFiles) {
      console.log(`Processing ZIP file: ${zipFile.name} with category: ${zipCategoryId}`);
      
      const extractedFileIds = await processZipFile(zipFile, {
        creatorId,
        currentFolder,
        categoryId: zipCategoryId, // Pass the selected category ID for ZIP files
        updateFileProgress: (fileName, progress) => {
          console.log(`ZIP progress: ${fileName} - ${progress}%`);
          updateFileProgress(fileName, progress);
        },
        updateFileStatus: (fileName, status, error) => {
          console.log(`ZIP status: ${fileName} - ${status}`, error || '');
          const newStatus = status === 'uploading' ? 'uploading' 
            : status === 'processing' ? 'processing'
            : status === 'complete' ? 'complete' 
            : 'error';
          updateFileProgress(fileName, 100, newStatus);
          if (error) {
            setFileStatuses(prev => 
              prev.map(s => 
                s.name === fileName ? { ...s, error } : s
              )
            );
          }
        }
      });
      uploadedFileIds.push(...extractedFileIds);
      
      // Show success message for ZIP processing
      const folderName = zipFile.name.replace(/\.zip$/i, '');
      toast({
        title: "ZIP file processed",
        description: `Created folder "${folderName}" with ${extractedFileIds.length} files`,
      });
    }
    
    // Process regular files sequentially to avoid overwhelming the API
    for (const file of regularFiles) {
      // Skip files that are too large (already warned)
      if (file.size > MAX_FILE_SIZE_GB * 1024 * 1024 * 1024) continue;
      
      console.log(`Processing regular file ${file.name} for folder: ${currentFolder}`);
      
      const fileId = await processRegularFile(
        file,
        creatorId,
        currentFolder,
        (fileName) => {
          console.log(`Regular file complete: ${fileName}`);
          updateFileProgress(fileName, 100);
        },
        (fileName, status, error) => {
          console.log(`Regular file status: ${fileName} - ${status}`, error || '');
          const newStatus = status === 'uploading' ? 'uploading' 
            : status === 'processing' ? 'processing'
            : status === 'complete' ? 'complete' 
            : 'error';
          updateFileProgress(fileName, 100, newStatus);
          if (error) {
            setFileStatuses(prev => 
              prev.map(s => 
                s.name === fileName ? { ...s, error } : s
              )
            );
          }
        }
      );
      
      if (fileId) {
        uploadedFileIds.push(fileId);
      }
    }

    console.log(`Upload processing complete. Total files uploaded: ${uploadedFileIds.length}`);
    return uploadedFileIds;
  };

  return {
    isUploading,
    fileStatuses,
    overallProgress,
    showProgress,
    setShowProgress,
    handleFileChange,
    handleCancelUpload,
    MAX_FILE_SIZE_GB
  };
};
