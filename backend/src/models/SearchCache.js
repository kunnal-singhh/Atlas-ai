import mongoose from 'mongoose';

const searchCacheSchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    results: [
      {
        title: { type: String, required: true },
        snippet: { type: String, default: '' },
        source: { type: String, default: '' },
        link: { type: String, default: '' },
      }
    ],
    synthesized: {
      type: String,
      default: '',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index: document self-deletes when Date.now() >= expiresAt
    }
  },
  {
    timestamps: true,
  }
);

export const SearchCache = mongoose.models.SearchCache || mongoose.model('SearchCache', searchCacheSchema);
export default SearchCache;
