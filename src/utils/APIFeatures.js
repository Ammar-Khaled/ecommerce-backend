class APIFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr || {};
  }

  filter() {
    const queryObj = { ...this.queryStr };
    const excludedFields = ["page", "sort", "limit", "fields", "search", "q", "sortBy", "sortOrder", "status", "tags"];
    excludedFields.forEach((el) => delete queryObj[el]);
    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);
    const filterObj = JSON.parse(queryString);
    if (Object.keys(filterObj).length > 0) {
      this.query = this.query.find(filterObj);
    }
    return this;
  }

  sort() {
    if (this.queryStr.sortBy && this.queryStr.sortOrder) {
      const sortOrder = this.queryStr.sortOrder === "asc" ? 1 : -1;
      this.query = this.query.sort({ [this.queryStr.sortBy]: sortOrder });
    } else if (this.queryStr.sort) {
      let sort = this.queryStr.sort.split(",").join(" ");
      this.query = this.query.sort(sort);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  paginate() {
    const page = parseInt(this.queryStr.page) || 1;
    const limit = parseInt(this.queryStr.limit) || 10;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  search(searchFields = []) {
    const searchQuery = this.queryStr.search || this.queryStr.q;
    if (searchQuery && searchFields && searchFields.length > 0) {
      const searchFilter = {
        $or: searchFields.map((field) => ({
          [field]: { $regex: new RegExp(searchQuery, "i") },
        })),
      };

      this.query = this.query.find(searchFilter);
    }

    return this;
  }

  limitFields() {
    if (this.queryStr.fields) {
      let { fields } = this.queryStr;
      fields = fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }
}

module.exports = APIFeatures;

// How to use:
// const features = new APIFeatures(Model.find(), req.query)
//   .filter()
//   .search(["title", "content"])
//   .sort()
//   .paginate();
// const posts = await features.query;
