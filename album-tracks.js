export default async function handler(req, res) {
  const masterId = req.query.master_id;

  if (!masterId) {
    return res.status(400).json({
      error: "Parâmetro 'master_id' é obrigatório"
    });
  }

  const token = process.env.DISCOGS_TOKEN;

  if (!token) {
    return res.status(500).json({
      error: "Token do Discogs não configurado"
    });
  }

  try {
    const masterUrl = `https://api.discogs.com/masters/${masterId}`;

    const response = await fetch(masterUrl, {
      headers: {
        Authorization: `Discogs token=${token}`,
        "User-Agent": "playlist-api/1.0"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Erro ao buscar master no Discogs"
      });
    }

    const data = await response.json();

    const tracklist = (data.tracklist || []).map(track => ({
      position: track.position,
      title: track.title
    }));

    res.status(200).json({
      master_id: masterId,
      title: data.title,
      year: data.year,
      tracks: tracklist
    });
  } catch (error) {
    res.status(500).json({
      error: "Erro ao consultar tracklist",
      details: error.message
    });
  }
}
