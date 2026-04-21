
'use server';

import { uploadMediaToStorage } from '@/lib/storage-utils';

export async function uploadProductImageAction(dataUri: string, fileName: string) {
    try {
        const path = `shop/products/${Date.now()}_${fileName}`;
        const imageUrl = await uploadMediaToStorage(dataUri, path);
        return { success: true, imageUrl };
    } catch (error: any) {
        console.error("Error uploading product image:", error);
        return { success: false, error: error.message };
    }
}
