import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ShoppingCart, Package, Ticket, Copy, Check } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

const SupplyDepot: React.FC = () => {
  const { user } = useAuth();
  const {
    myStats,
    shopItems,
    myPurchases,
    isLoading,
    purchaseItem
  } = useGamification();

  const [copiedVoucher, setCopiedVoucher] = useState<string | null>(null);

  const copyVoucherCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedVoucher(code);
    setTimeout(() => setCopiedVoucher(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeItems = shopItems.filter(item => item.is_active);

  return (
    <div className="space-y-8">
      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
        <CardContent className="py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-6xl">🍌</div>
              <div>
                <p className="text-base text-muted-foreground" style={{ fontFamily: "'Orbitron', sans-serif" }}>Your Balance</p>
                <p className="text-4xl font-bold text-yellow-500" style={{ fontFamily: "'Orbitron', sans-serif" }}>{myStats?.banana_balance || 0} Bananas</p>
              </div>
            </div>
            <ShoppingCart className="h-14 w-14 text-muted-foreground/30" />
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Shop / My Purchases */}
      <Tabs defaultValue="shop" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto p-1">
          <TabsTrigger value="shop" className="flex items-center gap-2 py-3 text-base">
            <Package className="h-5 w-5" />
            Shop
          </TabsTrigger>
          <TabsTrigger value="my-purchases" className="flex items-center gap-2 py-3 text-base">
            <Ticket className="h-5 w-5" />
            My Vouchers
          </TabsTrigger>
        </TabsList>

        {/* Shop Tab */}
        <TabsContent value="shop" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeItems.map(item => (
              <Card key={item.id} className="relative overflow-hidden flex flex-col h-[280px]">
                {item.stock !== null && item.stock <= 0 && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                    <Badge variant="destructive" className="text-xl px-5 py-3" style={{ fontFamily: "'Orbitron', sans-serif" }}>Out of Stock</Badge>
                  </div>
                )}
                {/* Header - Item Name */}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>{item.name}</CardTitle>
                    <Package className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                  {item.stock !== null && (
                    <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                      {item.stock} in stock
                    </p>
                  )}
                </CardHeader>

                {/* Body - Description (fixed height with overflow) */}
                <CardContent className="flex-1 overflow-hidden">
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-4" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                      {item.description}
                    </p>
                  )}
                </CardContent>

                {/* Footer - Banana Cost & Button */}
                <CardFooter className="flex-col gap-3 pt-0">
                  <div className="flex items-center justify-center gap-2 w-full">
                    <span className="text-2xl">🍌</span>
                    <span className="text-2xl font-bold text-yellow-500" style={{ fontFamily: "'Orbitron', sans-serif" }}>{item.banana_cost}</span>
                  </div>
                  <Button 
                    className="w-full text-sm py-4" 
                    style={{ fontFamily: "'Orbitron', sans-serif" }}
                    disabled={(myStats?.banana_balance || 0) < item.banana_cost || (item.stock !== null && item.stock <= 0)}
                    onClick={() => purchaseItem(item.id)}
                  >
                    {(myStats?.banana_balance || 0) < item.banana_cost ? 'Not enough bananas' : 'Purchase'}
                  </Button>
                </CardFooter>
              </Card>
            ))}

            {activeItems.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="py-16 text-center text-muted-foreground text-lg">
                  No items available in the shop right now.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* My Purchases Tab */}
        <TabsContent value="my-purchases" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">My Vouchers</CardTitle>
              <CardDescription className="text-base">Your purchased vouchers and their redemption status</CardDescription>
            </CardHeader>
            <CardContent>
              {myPurchases.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  You haven't purchased anything yet. Visit the shop to spend your bananas!
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Voucher Code</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Purchased</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myPurchases.map(purchase => (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-medium">{purchase.shop_item?.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="bg-muted px-2 py-1 rounded text-sm">{purchase.voucher_code}</code>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => copyVoucherCode(purchase.voucher_code)}
                            >
                              {copiedVoucher === purchase.voucher_code ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{purchase.banana_spent} 🍌</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              purchase.status === 'redeemed' ? 'default' : 
                              purchase.status === 'expired' ? 'destructive' : 
                              'secondary'
                            }
                          >
                            {purchase.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(purchase.purchased_at), 'MMM d, yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupplyDepot;
