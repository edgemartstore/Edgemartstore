// Edge Mart Automatic Database Hydrator

import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { db, OperationType, handleFirestoreError } from "./firebase";
import { INITIAL_CATEGORIES, generateProducts } from "../data/initialData";

export async function checkAndSeedDatabase(onProgress?: (msg: string) => void) {
  try {
    if (onProgress) onProgress("Checking Edge Mart store catalogs...");

    // Check categories
    const categoriesSnap = await getDocs(collection(db, "categories"));
    let isCategoriesSeeded = !categoriesSnap.empty;

    // Check products
    const productsSnap = await getDocs(collection(db, "products"));
    let isProductsSeeded = !productsSnap.empty;

    if (isCategoriesSeeded && isProductsSeeded) {
      if (onProgress) onProgress("Edge Mart database hydrated successfully!");
      return;
    }

    // Seed Categories
    if (!isCategoriesSeeded) {
      if (onProgress) onProgress("Initializing budget category allowances...");
      const batch = writeBatch(db);
      
      INITIAL_CATEGORIES.forEach((cat) => {
        const docRef = doc(db, "categories", cat.id);
        batch.set(docRef, {
          id: cat.id,
          name: cat.name,
          budget: cat.budget,
          spent: 0
        });
      });
      await batch.commit();
    }

    // Seed Products (208 items)
    if (!isProductsSeeded) {
      if (onProgress) onProgress("Hydrating inventory catalog with 200+ items...");
      const productsList = generateProducts();
      
      // Firestore batch size limit is 500 writes. We have 208 products, so we can do it in 1 or 2 batches safely.
      const batch = writeBatch(db);
      productsList.forEach((prod) => {
        const docRef = doc(db, "products", prod.id);
        batch.set(docRef, prod);
      });
      await batch.commit();
    }

    if (onProgress) onProgress("Catalog hydration finalized successfully!");
  } catch (error: any) {
    console.error("Critical: Failed to hydrate database indices:", error);
    if (onProgress) onProgress(`Hydration stalled: ${error.message}`);
    if (error?.code === "permission-denied" || error?.message?.includes("perm") || error?.message?.includes("Permission denied")) {
      handleFirestoreError(error, OperationType.WRITE, "seeding");
    }
  }
}
