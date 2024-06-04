const Product = require('../models/Product');

const PAGE_SIZE = 1;
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
    res.status(200).json({ status: 'success', product });
  } catch (error) {
    res.status(400).json({ status: 'fail', error: error.message });
  }
};

productController.getProducts = async (req, res) => {
  try {
    const { page, name } = req.query;
    const cond = name ? { name: { $regex: name, $options: 'i' } } : {};
    let query = Product.find(cond);
    let response = { status: 'success' };
    if (page) {
      // 몽구스 함수 skip(), limit()
      // ex ) 10개의 상품이 있는데 한 페이지당 5개씩 보여주고 싶으면
      // limit은 5가 되고 skip은 2페이지로 가면 1페이지의 5개는 제외하고(스킵)
      // 2페이지의 5개만 보여줄거라는 ...!?
      query.skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE);
      // 최종 몇개의 페이지가 있는지 !
      // 데이터가 총 몇개 있는지
      const totalItemNum = await Product.find(cond).count();
      // 데이터 총 개수 / PAGE_SIZE
      const totalPageNum = Math.ceil(totalItemNum / PAGE_SIZE);
      response.totalPageNum = totalPageNum;
    }

    const productList = await query.exec();
    response.data = productList;
    res.status(200).json(response);
    // res.status(200).json({ status: 'success', data: productList });
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

    const product = await (Product.findByIdAndUpdate =
      ({ _id: productId },
      { sku, name, size, image, price, description, category, stock, status },
      { new: true }));
    if (!product) throw new Error('상품이 존재하지 않습니다 !');
    res.status(200).json({ status: 'success', data: product });
  } catch (error) {
    res.status(400).json({ status: 'fail', error: error.message });
  }
};

module.exports = productController;
