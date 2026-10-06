# WLW TV Archive

## 添加电视剧

以后只需要编辑 `series-input.js`，在数组末尾添加一行：

```js
{"title":"电视剧英文名","year":2026,"others":false}
```

- `year` 只填写首播年份。
- WLW 电视剧填写 `others:false`。
- 非 WLW、只放在 Others 里的电视剧填写 `others:true`。
- 提交后运行 **Update TMDB detail data** workflow。

Workflow 会自动创建或更新国家分类、海报、首播年份、running years、平台、体裁、简介、季/集、Cast、Crew、中英文搜索标题和所有列表卡片。TMDB 无法识别的标题会记录在 `tmdb-cast-review.json` 的 `unmatched` 中，不会导致整个 workflow 失败；必要时可在 `movie-metadata.js` 为该剧补充 `tmdbId` 或 `aliases`。

A separate TV archive based on the WLW Film Archive design. Years on cards are always first-air years.

## Add a series

Add the series to the correct country in `catalog-data.js`:

```js
{ "title": "Example Series", "year": 2022 }
```

`year` must be the first-air year. Optional aliases, manual genres, networks and a known TMDB ID belong in `movie-metadata.js`:

```js
window.WLW_MOVIE_METADATA = {
  "Example Series": {
    "tmdbId": "12345",
    "aliases": [],
    "genres": ["Drama", "Romance"],
    "networks": ["Netflix"]
  }
};
```

Non-WLW series go only in `others-data.js`. They appear on the **Others** page and are excluded from Countries, Years, Networks, Genres and Alphabet.

The supported homepage genres are Action & Adventure, Animation, Comedy, Crime, Documentary, Drama, Family, Mystery, Romance, Sci-Fi & Fantasy, Soap, Sports, Thriller, and War & Politics. Romance, Sports and Thriller may need to be added manually because TMDB does not always classify TV shows with those labels.

## TMDB setup

In the GitHub repository, create an Actions secret named `TMDB_API_KEY`. Then open **Actions → Update TMDB detail data → Run workflow**. The workflow fetches TV-only data: first/last air dates, running status, genres, networks, poster, seasons, episodes, cast and crew.

Do not put the API key in browser JavaScript.

## Resources

Add links in `movie-resources.js`. The default extraction code shown before a link is added is `yuri`.

## Publish

Upload the contents of this folder so `index.html` is at the repository root. In **Settings → Pages**, choose **Deploy from a branch**, `main`, `/(root)`.
