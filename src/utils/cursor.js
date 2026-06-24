/**
 * Cursor Utility — Keyset / Cursor-Based Pagination
 *
 * WHY NOT skip/limit?
 * ------------------------------------------------------------------
 * skip(N) tells MongoDB to scan and discard N documents before
 * returning results. With 200 000 records this is O(N) — slow and
 * expensive. Worse, if a document is inserted or updated between
 * page requests the entire offset shifts, causing:
 *   • Duplicate records (same doc appears on two pages)
 *   • Missing records  (a doc is skipped entirely)
 *
 * WHY cursor / keyset pagination?
 * ------------------------------------------------------------------
 * We remember WHERE we are in the sorted order by storing the sort
 * key values of the last document seen (updatedAt + _id).
 * The next query asks: "give me the next N docs whose sort key is
 * strictly less than the cursor values."  MongoDB resolves this with
 * an index seek — O(log N) — regardless of page number.
 * Insertions or updates to earlier pages never affect the cursor
 * position, so the client can never see duplicates or gaps.
 *
 * Cursor encoding
 * ------------------------------------------------------------------
 * We JSON-serialize { updatedAt, _id } and Base64-encode it so the
 * value is URL-safe and opaque to the client.
 */

/**
 * Encode a cursor from the last document in a page.
 * @param {object} lastDoc  — Mongoose document or plain object
 * @returns {string} base64-encoded cursor string
 */
const encodeCursor = (lastDoc) => {
  if (!lastDoc) return null;

  const payload = {
    updatedAt: lastDoc.updatedAt instanceof Date
      ? lastDoc.updatedAt.toISOString()
      : lastDoc.updatedAt,
    _id: lastDoc._id.toString(),
  };

  return Buffer.from(JSON.stringify(payload)).toString('base64url');
};

/**
 * Decode a cursor string back into its components.
 * @param {string} cursorStr — base64-encoded cursor
 * @returns {{ updatedAt: Date, _id: string }}
 * @throws {Error} if the cursor is malformed
 */
const decodeCursor = (cursorStr) => {
  try {
    const json = Buffer.from(cursorStr, 'base64url').toString('utf8');
    const { updatedAt, _id } = JSON.parse(json);

    if (!updatedAt || !_id) throw new Error('Missing fields');

    return {
      updatedAt: new Date(updatedAt),
      _id,
    };
  } catch {
    throw new Error('Invalid or malformed cursor');
  }
};

/**
 * Build the MongoDB $or query that implements cursor-based keyset
 * pagination sorted by { updatedAt: -1, _id: -1 }.
 *
 * Desired behaviour: return documents that come AFTER the cursor
 * position in descending (updatedAt, _id) order.
 *
 * A document D comes "after" cursor C when:
 *   D.updatedAt  < C.updatedAt                          (earlier date)
 *   OR
 *   D.updatedAt === C.updatedAt AND D._id < C._id       (same date, smaller id)
 *
 * This correctly handles ties in updatedAt by falling back to _id.
 *
 * @param {{ updatedAt: Date, _id: string }} cursor
 * @returns {object} MongoDB query object
 */
const buildCursorQuery = ({ updatedAt, _id }) => ({
  $or: [
    { updatedAt: { $lt: updatedAt } },
    { updatedAt: updatedAt, _id: { $lt: _id } },
  ],
});

module.exports = { encodeCursor, decodeCursor, buildCursorQuery };
