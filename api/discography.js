export default function handler(req, res) {
  const artist = req.query.artist;

  if (!artist) {
    return res.status(400).json({
      error: "Parâmetro 'artist' é obrigatório"
    });
  }

  res.status(200).json({
    artist: artist,
    albums: []
  });
}
