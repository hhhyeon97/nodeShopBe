// const randomStringGenerator = () => {
//   const randomString = Array.from(Array(10), () =>
//     Math.floor(Math.random() * 36).toString(36),
//   ).join('');

//   return randomString;
// }; // orderNum 만들 때 쓸 것 !

// module.exports = { randomStringGenerator };

const generateOrderNumber = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(2); // 연도의 마지막 두 자리
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const currentDate = `${year}${month}${day}`;

  const randomString = Array.from(Array(6), () =>
    Math.floor(Math.random() * 36).toString(36),
  ).join('');

  return `${currentDate}${randomString}`;
};

module.exports = { generateOrderNumber };
