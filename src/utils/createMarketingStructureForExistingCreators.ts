import { supabase } from "@/integrations/supabase/client";
import { MarketingFoldersService } from "@/services/creator/MarketingFoldersService";

/**
 * Utility script to create default marketing structure for all existing creators
 */
export const createMarketingStructureForExistingCreators = async () => {
  try {
    console.log("Starting to create marketing structure for existing creators...");
    
    // Get all existing creators
    const { data: creators, error: creatorsError } = await supabase
      .from('creators')
      .select('id, name')
      .eq('active', true)
      .order('name');
    
    if (creatorsError) {
      console.error("Error fetching creators:", creatorsError);
      return { success: false, error: creatorsError.message };
    }
    
    if (!creators || creators.length === 0) {
      console.log("No creators found");
      return { success: true, processed: 0, skipped: 0 };
    }
    
    console.log(`Found ${creators.length} creators to process`);
    
    // Get creators who already have categories (to avoid duplicates)
    const { data: existingCategories, error: categoriesError } = await supabase
      .from('file_categories')
      .select('creator')
      .order('creator');
    
    if (categoriesError) {
      console.error("Error fetching existing categories:", categoriesError);
      return { success: false, error: categoriesError.message };
    }
    
    const creatorsWithCategories = new Set(
      existingCategories?.map(cat => cat.creator) || []
    );
    
    console.log(`Found ${creatorsWithCategories.size} creators who already have categories`);
    
    let processed = 0;
    let skipped = 0;
    let failed = 0;
    const results: Array<{ creatorId: string; name: string; status: 'success' | 'skipped' | 'failed'; error?: string }> = [];
    
    // Process each creator
    for (const creator of creators) {
      try {
        // Skip if creator already has categories
        if (creatorsWithCategories.has(creator.id)) {
          console.log(`Skipping ${creator.name} - already has categories`);
          skipped++;
          results.push({
            creatorId: creator.id,
            name: creator.name,
            status: 'skipped'
          });
          continue;
        }
        
        console.log(`Creating marketing structure for: ${creator.name} (${creator.id})`);
        
        const success = await MarketingFoldersService.createDefaultMarketingStructure(creator.id);
        
        if (success) {
          processed++;
          results.push({
            creatorId: creator.id,
            name: creator.name,
            status: 'success'
          });
          console.log(`✓ Successfully created marketing structure for ${creator.name}`);
        } else {
          failed++;
          results.push({
            creatorId: creator.id,
            name: creator.name,
            status: 'failed',
            error: 'Unknown error'
          });
          console.error(`✗ Failed to create marketing structure for ${creator.name}`);
        }
        
        // Add a small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          creatorId: creator.id,
          name: creator.name,
          status: 'failed',
          error: errorMessage
        });
        console.error(`✗ Error processing ${creator.name}:`, error);
      }
    }
    
    console.log("\n=== SUMMARY ===");
    console.log(`Total creators: ${creators.length}`);
    console.log(`Successfully processed: ${processed}`);
    console.log(`Skipped (already had categories): ${skipped}`);
    console.log(`Failed: ${failed}`);
    
    if (failed > 0) {
      console.log("\nFailed creators:");
      results
        .filter(r => r.status === 'failed')
        .forEach(r => console.log(`- ${r.name}: ${r.error}`));
    }
    
    return {
      success: true,
      processed,
      skipped,
      failed,
      results
    };
    
  } catch (error) {
    console.error("Error in createMarketingStructureForExistingCreators:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Export for potential manual execution from browser console
if (typeof window !== 'undefined') {
  (window as any).createMarketingStructureForExistingCreators = createMarketingStructureForExistingCreators;
}