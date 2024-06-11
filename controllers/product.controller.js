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

productController.getProducts = async (req, res) => {
  try {
    const { page, name } = req.query;
    const cond = name
      ? { name: { $regex: name, $options: 'i' }, isDeleted: false }
      : { isDeleted: false };
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
  // 내가 사려는 아이템 재고 정보 들고 오기
  const product = await Product.findById(item.productId);
  // 내가 사려는 아이템 qty, 재고 비교
  if (product.stock[item.size] < item.qty) {
    // 재고가 불충분하면 불충문 메세지와 함께 데이터 반환
    return {
      isVerify: false,
      message: `${product.name}의 ${item.size} 사이즈 재고가 부족합니다.`,
    };
  }
  // 재고가 충분함을 나타내는 플래그 반환
  return { isVerify: true };
};

productController.checkItemListStock = async (itemList) => {
  const insufficientStockItems = []; // 재고가 불충분한 아이템을 저장할 배열

  // 재고 확인 로직
  for (const item of itemList) {
    const stockCheck = await productController.checkStock(item);
    if (!stockCheck.isVerify) {
      insufficientStockItems.push({ item, message: stockCheck.message });
    }
  }

  // 만약 재고가 불충분한 아이템이 있다면, 불충분한 아이템 목록 반환
  if (insufficientStockItems.length > 0) {
    return insufficientStockItems;
  }

  // 재고가 충분한 아이템들에 대해 재고 차감
  for (const item of itemList) {
    const product = await Product.findById(item.productId);
    const newStock = { ...product.stock };
    newStock[item.size] -= item.qty;
    product.stock = newStock;
    await product.save();
  }

  // 모든 아이템의 재고가 충분함을 나타내는 빈 배열 반환
  return [];
};

module.exports = productController;
