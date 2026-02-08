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

    const artistResult = searchData.results[0];

    const releasesUrl = `https://api.discogs.com/artists/${artistResult.id}/releases`;

    const releasesResponse = await fetch(releasesUrl, {
      headers: {
        Authorization: `Discogs token=${token}`,
        "User-Agent": "playlist-api/1.0"
      }
    });

    const releasesData = await releasesResponse.json();

    res.status(200).json({
      artist: artist,
      discogs_artist_id: artistResult.id,
      releases: releasesData.releases || []
    });
  } catch (error) {
    res.status(500).json({
      error: "Erro ao consultar o Discogs",
      details: error.message
    });
  }
}
