class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  filter() {
    const querryObj = { ...this.queryString };
    const excludeFields = ['page', 'sort', 'limit', 'fields']; // To ignore this querry which are written inside array.
    excludeFields.forEach((el) => delete querryObj[el]);

    // 1.B) Advance filtering
    let queryStr = JSON.stringify(querryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); //--> Here we use regular Expression
    // {difficulty:'easy',duration:{$gte:5}}
    //{ difficulty: 'easy', duration: { gte: '5' } }'
    this.query = this.query.find(JSON.parse(queryStr));

    //let query = Tour.find(JSON.parse(queryStr));
    return this;
  }
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); // -__v --> means everything exclude __v
    }
    return this;
  }
  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    //page=2&limit=10, 1-10, page 1 ,11-20, page 2, 21-30 page 3 and so on
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}
module.exports = APIFeatures;
