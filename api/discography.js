export default async function handler(req, res) {
  const artist = req.query.artist;

  if (!artist) {
    return res.status(400).json({
      error: "Parâmetro 'artist' é obrigatório"
    });
  }

  const token = process.env.DISCOGS_TOKEN;

  if (!token) {
    return res.status(500).json({
      error: "Token do Discogs não configurado"
    });
  }

  try {
    // 1. Buscar artista
    const searchUrl = `https://api.discogs.com/database/search?type=artist&q=${encodeURIComponent(
      artist
    )}`;

    const searchResponse = await fetch(searchUrl, {
      headers: {
        Authorization: `Discogs token=${token}`,
        "User-Agent": "playlist-api/1.0"
      }
    });

    const searchData = await searchResponse.json();

    if (!searchData.results || searchData.results.length === 0) {
      return res.status(404).json({
        artist,
        albums: [],
        message: "Artista não encontrado no Discogs"
      });
    }

    const artistId = searchData.results[0].id;

    // 2. Buscar releases do artista
    const releasesUrl = `https://api.discogs.com/artists/${artistId}/releases?per_page=100`;

    const releasesResponse = await fetch(releasesUrl, {
      headers: {
        Authorization: `Discogs token=${token}`,
        "User-Agent": "playlist-api/1.0"
      }
    });

    const releasesData = await releasesResponse.json();
    const releases = releasesData.releases || [];

    // 3. Filtragem CONSERVADORA
    const forbiddenWords = [
      "live",
      "ao vivo",
      "greatest",
      "best",
      "hits",
      "collection",
      "compilation",
      "remix",
      "soundtrack",
      "trilha"
    ];

    const albumsMap = new Map();

    for (const item of releases) {
      if (item.type !== "master") continue;
      if (!item.title || !item.year) continue;

      const titleLower = item.title.toLowerCase();

      const hasForbiddenWord = forbiddenWords.some(word =>
        titleLower.includes(word)
      );

      if (hasForbiddenWord) continue;

      // evita duplicatas pelo título
      if (!albumsMap.has(item.title)) {
        albumsMap.set(item.title, {
          title: item.title,
          year: item.year
        });
      }
    }

    // 4. Ordenar por ano
    const albums = Array.from(albumsMap.values()).sort(
      (a, b) => a.year - b.year
    );

    res.status(200).json({
      artist,
      albums
    });
  } catch (error) {
    res.status(500).json({
      error: "Erro ao consultar o Discogs",
      details: error.message
    });
  }
}
