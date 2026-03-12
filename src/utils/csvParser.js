const fs = require('fs');
const csv = require('csv-parser');


async function importProductsCSV(filePath, ProductModel) {
    return new Promise((resolve, reject) => {
        let inserted = 0;
        let updated = 0;
        let skipped = 0;

        let batch = [];
        const BATCH_SIZE = 10;

        const processBatch = async () => {
            if (batch.length === 0) return;

            const bulkOps = batch.map(product => ({
                updateOne: {
                    filter: { sku: product.sku },
                    update: { $set: product },
                    upsert: true // Creates the document if it doesn't exist
                }
            }));

            try {
                const result = await ProductModel.bulkWrite(bulkOps);
                inserted += result.upsertedCount || 0;
                updated += result.modifiedCount || 0;
            } catch (error) {
                throw error;
            }

            batch = []; // Clear the batch after processing
        };

        const stream = fs.createReadStream(filePath).pipe(csv());

        stream.on('data', async (row) => {
            // Skip rows with missing SKUs
            if (!row.sku || row.sku.trim() === '') {
                skipped++;
                return;
            }

            // Format the data structure
            const product = {
                sku: row.sku.trim(),
                title: row.title,
                description: row.description,
                price: parseFloat(row.price),
                stock: parseInt(row.stock, 10),
                images: row.images ? row.images.split(';').map(i => i.trim()) : [],
                categories: row.categories ? row.categories.split(';').map(c => c.trim()) : []
            };

            batch.push(product);

            // Pause stream to process batch and avoid overwhelming memory
            if (batch.length >= BATCH_SIZE) {
                stream.pause();
                processBatch()
                    .then(() => stream.resume())
                    .catch(err => {
                        stream.destroy();
                        reject(err);
                    });
            }
        });

        stream.on('end', async () => {
            try {
                // Process any remaining items in the final batch
                await processBatch();
                resolve({ inserted, updated, skipped });
            } catch (err) {
                reject(err);
            }
        });

        stream.on('error', (error) => {
            reject(error);
        });
    });
}

module.exports = { importProductsCSV };