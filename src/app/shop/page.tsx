
import React from 'react';
import ShopClient from './ShopClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cohéro Shop - Officiel Merchandise',
  description: 'Gør din studietid mere stilfuld med officielt Cohéro merchandise. Fra premium hoodies til de klassiske kaffekopper.',
};

export default function ShopPage() {
  return <ShopClient />;
}
