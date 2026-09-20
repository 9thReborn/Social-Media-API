// Shared by every paginated list endpoint (comments now, posts next step).
// Turns query-string strings ("2", "20") into safe integers with sane
// bounds, and computes the `skip` value MongoDB's .skip()/.limit() need.
function getPagination(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (!Number.isInteger(page) || page < 1) page = 1;
  if (!Number.isInteger(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit; // stops a client requesting ?limit=100000

  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

// Wraps a result set in a consistent { data, pagination } envelope so every
// list endpoint in the API returns pagination info the same shape.
function paginatedResponse(items, { page, limit }, totalCount) {
  return {
    data: items,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page * limit < totalCount,
    },
  };
}

module.exports = { getPagination, paginatedResponse };
