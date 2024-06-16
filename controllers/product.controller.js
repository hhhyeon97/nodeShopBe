const Product = require('../models/Product');

const PAGE_SIZE = 5;
const productController = {};
productController.createProduct = async (req, res) => {
  try {
    const {
      sku,
      name,
      size,
      image,
      category,
      description,
      price,
      stock,
      status,
    } = req.body;

    const product = new Product({
      sku,
      name,
      size,
      image,
      category,
      description,
      price,
      stock,
      status,
    });

    await product.save();

    // 새로 생성된 상품이 있는 페이지 번호를 계산
    const totalItemNum = await Product.find({ isDeleted: false }).count();
    const totalPageNum = Math.ceil(totalItemNum / PAGE_SIZE);

    res.status(200).json({ status: 'success', product, totalPageNum });
  } catch (error) {
    res.status(400).json({ status: 'fail', error: error.message });
  }
};

// productController.getProducts = async (req, res) => {
//   try {
//     const { page, name } = req.query;
//     const cond = name
//       ? { name: { $regex: name, $options: 'i' }, isDeleted: false }
//       : { isDeleted: false };
//     let query = Product.find(cond);
//     let response = { status: 'success' };
//     if (page) {
//       // 몽구스 함수 skip(), limit()
//       // ex ) 10개의 상품이 있는데 한 페이지당 5개씩 보여주고 싶으면
//       // limit은 5가 되고 skip은 2페이지로 가면 1페이지의 5개는 제외하고(스킵)
//       // 2페이지의 5개만 보여줄거라는 ...!?
//       query.skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE);
//       // 최종 몇개의 페이지가 있는지 !
//       // 데이터가 총 몇개 있는지
//       const totalItemNum = await Product.find(cond).count();
//       // 데이터 총 개수 / PAGE_SIZE
//       const totalPageNum = Math.ceil(totalItemNum / PAGE_SIZE);
//       response.totalPageNum = totalPageNum;
//     }

//     const productList = await query.exec();
//     response.data = productList;
//     res.status(200).json(response);
//     // res.status(200).json({ status: 'success', data: productList });
//   } catch (error) {
//     res.status(400).json({ status: 'fail', error: error.message });
//   }
// };

productController.getProducts = async (req, res) => {
  try {
    const { page, name, category } = req.query; // category 파라미터 추가
    const cond = { isDeleted: false }; // 기본 조건

    if (name) {
      cond.name = { $regex: name, $options: 'i' }; // 이름 필터링 추가
    }
    if (category) {
      cond.category = category; // 카테고리 필터링 추가
    }

    let query = Product.find(cond);
    let response = { status: 'success' };
    if (page) {
      query.skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE);
      const totalItemNum = await Product.find(cond).count();
      const totalPageNum = Math.ceil(totalItemNum / PAGE_SIZE);
      response.totalPageNum = totalPageNum;
    }

    const productList = await query.exec();
    response.data = productList;
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ status: 'fail', error: error.message });
  }
};

productController.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const {
      sku,
      name,
      size,
      image,
      price,
      description,
      category,
      stock,
      status,
    } = req.body;

    const product = await Product.findByIdAndUpdate(
      productId,
      { sku, name, size, image, price, description, category, stock, status },
      { new: true },
    );

    if (!product) throw new Error('상품이 존재하지 않습니다 !');

    res.status(200).json({ status: 'success', data: product });
  } catch (error) {
    res.status(400).json({ status: 'fail', error: error.message });
  }
};

productController.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findByIdAndUpdate(
      { _id: productId },
      { isDeleted: true },
    );
    if (!product) throw new Error('상품이 존재하지 않습니다 !');
    res.status(200).json({ status: 'success' });
  } catch (error) {
    res.status(400).json({ status: 'fail', error: error.message });
  }
};

productController.getProductById = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) throw new Error('상품이 존재하지 않습니다 !');
    res.status(200).json({ status: 'success', data: product });
  } catch (error) {
    res.status(400).json({ status: 'fail', error: error.message });
  }
};

productController.checkStock = async (item) => {
  const product = await Product.findById(item.productId);
  if (product.stock[item.size] < item.qty) {
    return {
      isVerify: false,
      message: `${product.name}의 ${item.size} 사이즈 재고가 부족합니다.`,
    };
  }
  return { isVerify: true, product }; // product를 반환하여 나중에 재사용할 수 있게 함
};

productController.checkItemListStock = async (itemList) => {
  const insufficientStockItems = [];

  // 모든 아이템의 재고를 확인하는 작업을 병렬로 수행
  const stockChecks = await Promise.all(
    itemList.map((item) => productController.checkStock(item)),
  );

  for (const stockCheck of stockChecks) {
    if (!stockCheck.isVerify) {
      insufficientStockItems.push({
        item: stockCheck.item,
        message: stockCheck.message,
      });
    }
  }

  // 재고가 부족한 아이템이 있으면 반환
  if (insufficientStockItems.length > 0) {
    return insufficientStockItems;
  }

  // 재고가 충분한 아이템들에 대해 재고 차감을 병렬로 수행
  await Promise.all(
    stockChecks.map(async (stockCheck, index) => {
      if (stockCheck.isVerify) {
        const item = itemList[index];
        const product = stockCheck.product;
        const newStock = { ...product.stock };
        newStock[item.size] -= item.qty;
        product.stock = newStock;
        await product.save();
      }
    }),
  );

  return [];
};

productController.getStatistics = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isDeleted: false });
    const categoryStats = await Product.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalProducts,
        categoryStats,
      },
    });
  } catch (error) {
    res.status(400).json({ status: 'fail', error: error.message });
  }
};

module.exports = productController;
