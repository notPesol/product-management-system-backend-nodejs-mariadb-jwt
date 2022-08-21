function validProductData(
  codeName,
  brandId,
  categoryId,
  price,
  quantity,
  id = null
) {
  if (id) {
    return Boolean(
      id && codeName && brandId && categoryId && price && quantity
    );
  }
  return Boolean(codeName && brandId && categoryId && price && quantity);
}

const wrapper = (func) => {
  return (req, res, next) => {
    func(req, res, next).catch((err) => next(err));
  };
};

module.exports = {
  validProductData,
  wrapper
};
