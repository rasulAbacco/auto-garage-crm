import express from'express';
const app = express();
const port = 5000;

// Define a route for the root URL
app.get('/', (req, res) => {
  res.send('Backend is Up and Running!');
});

// Start the server and listen for connections
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
