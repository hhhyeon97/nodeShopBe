// const randomStringGenerator = () => {
//   const randomString = Array.from(Array(10), () =>
//     Math.floor(Math.random() * 36).toString(36),
//   ).join('');

//   return randomString;
// }; // orderNum 만들 때 쓸 것 !

// module.exports = { randomStringGenerator };

// 주문 번호 형태 바꿔 보기
let lastOrderNumber = 0;
let lastOrderDate = '';

const generateOrderNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const currentDate = `${year}${month}${day}`;

  if (currentDate === lastOrderDate) {
    lastOrderNumber += 1;
  } else {
    lastOrderDate = currentDate;
    lastOrderNumber = 1;
  }

  const orderNumber = String(lastOrderNumber).padStart(4, '0');
  return `${currentDate}${orderNumber}`;
};

module.exports = { generateOrderNumber };
