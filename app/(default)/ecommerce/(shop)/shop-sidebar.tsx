type PriceRange = 'lt20' | '20-40' | '40-80' | 'gt80' | null

export default function ShopSidebar({
  selectedTags = [],
  onToggleTag,
  onClearTags,
  priceRange = null,
  onChangePriceRange,
  availableTags,
}: {
  selectedTags?: string[]
  onToggleTag: (tag: string) => void
  onClearTags: () => void
  priceRange?: PriceRange
  onChangePriceRange: (range: PriceRange) => void
  availableTags?: string[]
}) {
  const defaultTags = [
    'Apps / Software',
    'Design / Tech Products',
    'Books & Writing',
    'Education',
    'Drawing / Painting',
  ]
  const allTags = (availableTags && availableTags.length > 0) ? availableTags : defaultTags

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-3 sm:p-4 md:p-5 min-w-[12rem] sm:min-w-[15rem] lg:min-w-[18rem] xl:min-w-[20rem]">
        <div className="grid lg:grid-cols-1 xl:grid-cols-1 gap-4 sm:gap-6">
          {/* Group 1 */}
          <div>
            <div className="text-xs sm:text-sm text-gray-800 dark:text-gray-100 font-semibold mb-2 sm:mb-3">Discover</div>
            <ul className="text-xs sm:text-sm font-medium space-y-1.5 sm:space-y-2">
              <li>
                <button onClick={onClearTags} className="text-violet-500">View All</button>
              </li>
              {allTags.map(tag => (
                <li key={tag}>
                  <button
                    onClick={() => onToggleTag(tag)}
                    className={`hover:text-gray-700 dark:hover:text-gray-200 ${selectedTags.includes(tag) ? 'text-violet-500' : 'text-gray-600 dark:text-gray-300'}`}
                  >
                    {tag}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {/* Price Range */}
          <div>
            <div className="text-xs sm:text-sm text-gray-800 dark:text-gray-100 font-semibold mb-2 sm:mb-3">Price Range</div>
            <label className="sr-only">Price</label>
            <select
              className="form-select w-full text-xs sm:text-sm"
              value={priceRange ?? ''}
              onChange={(e) => onChangePriceRange((e.target.value || null) as PriceRange)}
            >
              <option value="">Any price</option>
              <option value="lt20">Less than $20</option>
              <option value="20-40">$20 - $40</option>
              <option value="40-80">$40 - $80</option>
              <option value="gt80">More than $80</option>
            </select>
          </div>
          {/* Group 3 */}
          <div>
            <div className="text-xs sm:text-sm text-gray-800 dark:text-gray-100 font-semibold mb-2 sm:mb-3">Multi Select</div>
            <ul className="space-y-1.5 sm:space-y-2">
              {allTags.map(tag => (
                <li key={tag}>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={selectedTags.includes(tag)}
                      onChange={() => onToggleTag(tag)}
                    />
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium ml-2">{tag}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
          {/* Group 4 */}
          <div>
            <div className="text-xs sm:text-sm text-gray-800 dark:text-gray-100 font-semibold mb-2 sm:mb-3">Sort By Rating</div>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                {/* Rating button */}
                <button className="flex items-center space-x-2 mr-2">
                  {/* Stars */}
                  <div className="flex space-x-1">
                    <svg className="fill-current text-yellow-500" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M10 5.934L8 0 6 5.934H0l4.89 3.954L2.968 16 8 12.223 13.032 16 11.11 9.888 16 5.934z" />
                    </svg>
                    <svg className="fill-current text-yellow-500" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M10 5.934L8 0 6 5.934H0l4.89 3.954L2.968 16 8 12.223 13.032 16 11.11 9.888 16 5.934z" />
                    </svg>
                    <svg className="fill-current text-yellow-500" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M10 5.934L8 0 6 5.934H0l4.89 3.954L2.968 16 8 12.223 13.032 16 11.11 9.888 16 5.934z" />
                    </svg>
                    <svg className="fill-current text-yellow-500" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M10 5.934L8 0 6 5.934H0l4.89 3.954L2.968 16 8 12.223 13.032 16 11.11 9.888 16 5.934z" />
                    </svg>
                    <svg className="fill-current text-gray-300 dark:text-gray-600" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M10 5.934L8 0 6 5.934H0l4.89 3.954L2.968 16 8 12.223 13.032 16 11.11 9.888 16 5.934z" />
                    </svg>
                  </div>
                  <div className="inline-flex text-sm text-gray-500 dark:text-gray-400 italic"><span className="sr-only">4 Stars</span> And up</div>
                </button>
              </li>
              <li>
                {/* Rating button */}
                <button className="flex items-center space-x-2 mr-2">
                  {/* Stars */}
                  <div className="flex space-x-1">
                    <svg className="fill-current text-yellow-500" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M10 5.934L8 0 6 5.934H0l4.89 3.954L2.968 16 8 12.223 13.032 16 11.11 9.888 16 5.934z" />
                    </svg>
                    <svg className="fill-current text-yellow-500" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M10 5.934L8 0 6 5.934H0l4.89 3.954L2.968 16 8 12.223 13.032 16 11.11 9.888 16 5.934z" />
                    </svg>
                    <svg className="fill-current text-yellow-500" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M10 5.934L8 0 6 5.934H0l4.89 3.954L2.968 16 8 12.223 13.032 16 11.11 9.888 16 5.934z" />
                    </svg>
                    <svg className="fill-current text-gray-300 dark:text-gray-600" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M10 5.934L8 0 6 5.934H0l4.89 3.954L2.968 16 8 12.223 13.032 16 11.11 9.888 16 5.934z" />
                    </svg>
                    <svg className="fill-current text-gray-300 dark:text-gray-600" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M10 5.934L8 0 6 5.934H0l4.89 3.954L2.968 16 8 12.223 13.032 16 11.11 9.888 16 5.934z" />
                    </svg>
                  </div>
                  <div className="inline-flex text-sm text-gray-500 dark:text-gray-400 italic"><span className="sr-only">3 Stars</span> And up</div>
                </button>
              </li>
              <li>
                {/* Rating button */}
                <button className="flex items-center space-x-2 mr-2">
                  {/* Stars */}
                  <div className="flex space-x-1">
                    <svg className="fill-current text-yellow-500" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M10 5.934L8 0 6 5.934H0l4.89 3.954L2.968 16 8 12.223 13.032 16 11.11 9.888 16 5.934z" />
                    </svg>
                    <svg className="fill-current text-yellow-500" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M10 5.934L8 0 6 5.934H0l4.89 3.954L2.968 16 8 12.223 13.032 16 11.11 9.888 16 5.934z" />
                    </svg>
                    <svg className="fill-current text-gray-300 dark:text-gray-600" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M10 5.934L8 0 6 5.934H0l4.89 3.954L2.968 16 8 12.223 13.032 16 11.11 9.888 16 5.934z" />
                    </svg>
                    <svg className="fill-current text-gray-300 dark:text-gray-600" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M10 5.934L8 0 6 5.934H0l4.89 3.954L2.968 16 8 12.223 13.032 16 11.11 9.888 16 5.934z" />
                    </svg>
                    <svg className="fill-current text-gray-300 dark:text-gray-600" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M10 5.934L8 0 6 5.934H0l4.89 3.954L2.968 16 8 12.223 13.032 16 11.11 9.888 16 5.934z" />
                    </svg>
                  </div>
                  <div className="inline-flex text-sm text-gray-500 dark:text-gray-400 italic"><span className="sr-only">2 Stars</span> And up</div>
                </button>
              </li>
              <li>
                {/* Rating button */}
                <button className="flex items-center space-x-2 mr-2">
                  {/* Stars */}
                  <div className="flex space-x-1">
                    <svg className="fill-current text-yellow-500" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M10 5.934L8 0 6 5.934H0l4.89 3.954L2.968 16 8 12.223 13.032 16 11.11 9.888 16 5.934z" />
                    </svg>
                    <svg className="fill-current text-gray-300 dark:text-gray-600" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M10 5.934L8 0 6 5.934H0l4.89 3.954L2.968 16 8 12.223 13.032 16 11.11 9.888 16 5.934z" />
                    </svg>
                    <svg className="fill-current text-gray-300 dark:text-gray-600" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M10 5.934L8 0 6 5.934H0l4.89 3.954L2.968 16 8 12.223 13.032 16 11.11 9.888 16 5.934z" />
                    </svg>
                    <svg className="fill-current text-gray-300 dark:text-gray-600" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M10 5.934L8 0 6 5.934H0l4.89 3.954L2.968 16 8 12.223 13.032 16 11.11 9.888 16 5.934z" />
                    </svg>
                    <svg className="fill-current text-gray-300 dark:text-gray-600" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M10 5.934L8 0 6 5.934H0l4.89 3.954L2.968 16 8 12.223 13.032 16 11.11 9.888 16 5.934z" />
                    </svg>
                  </div>
                  <div className="inline-flex text-sm text-gray-500 dark:text-gray-400 italic"><span className="sr-only">1 Stars</span> And up</div>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}