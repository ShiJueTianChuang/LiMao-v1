const { pool, initDatabase, initAiTables } = require('./db');

async function getProducts() {
  try {
    await initDatabase();
    await initAiTables();

    const [products] = await pool.query(`
      SELECT
        id,
        name,
        description,
        category,
        product_type,
        price,
        original_price,
        is_active,
        created_at
      FROM products
      WHERE is_active = 1
      ORDER BY product_type ASC, price ASC
    `);

    console.log('\n========== 所有产品 ==========\n');
    console.log(`总共有 ${products.length} 个产品\n`);

    const freeProducts = products.filter(p => p.product_type === 'free' || p.price === 0);
    const sourceProducts = products.filter(p => p.product_type === 'source' && p.price > 0);
    const customProducts = products.filter(p => p.product_type === 'custom' && p.price > 0);

    console.log('【开源项目】(免费):\n');
    if (freeProducts.length > 0) {
      freeProducts.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name}`);
        console.log(`   分类: ${p.category || '未分类'}`);
        console.log(`   价格: ¥0 (免费)`);
        console.log(`   描述: ${p.description || '无描述'}`);
        console.log('');
      });
    } else {
      console.log('暂无开源项目\n');
    }

    console.log('【付费项目】- 源码类:\n');
    if (sourceProducts.length > 0) {
      sourceProducts.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name}`);
        console.log(`   分类: ${p.category || '未分类'}`);
        console.log(`   原价: ¥${p.original_price || p.price}`);
        console.log(`   现价: ¥${p.price}`);
        console.log(`   描述: ${p.description || '无描述'}`);
        console.log('');
      });
    } else {
      console.log('暂无源码类付费项目\n');
    }

    console.log('【付费项目】- 定制类:\n');
    if (customProducts.length > 0) {
      customProducts.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name}`);
        console.log(`   分类: ${p.category || '未分类'}`);
        console.log(`   价格: ¥${p.price}`);
        console.log(`   描述: ${p.description || '无描述'}`);
        console.log('');
      });
    } else {
      console.log('暂无定制类付费项目\n');
    }

    console.log('========== 统计信息 ==========\n');
    console.log(`开源项目: ${freeProducts.length} 个`);
    console.log(`付费项目(源码): ${sourceProducts.length} 个`);
    console.log(`付费项目(定制): ${customProducts.length} 个`);
    console.log(`总计: ${products.length} 个\n`);

    await pool.end();
  } catch (error) {
    console.error('获取产品失败:', error);
  }
}

getProducts();
