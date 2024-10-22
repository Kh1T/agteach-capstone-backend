const generatePurchasedEmailContent = (products) => {
  const purchasedDate = new Date().toLocaleDateString();
  const content = `
      <p>Thank you for enrolling in the following courses:</p>
      ${products
        .map(
          (product) => `
        <div>
          <p>Course: <strong>${product.name}</strong></p>
          <p>Image: <img src="${product.imageUrl}" alt="${product.name}" width="100"/></p>
          <p>Price per unit: $${product.price}</p>
          <p>Quantity: ${product.quantity}</p>
        </div>
      `,
        )
        .join('')}
      <p>Purchased Date: ${purchasedDate}</p>
    `;
  return content;
};

module.exports = generatePurchasedEmailContent;
