const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  // Simulate some processing delay
  setTimeout(() => {
    res.json({ id, name: `User ${id}`, timestamp: new Date().toISOString() });
  }, Math.random() * 100);
});

app.post('/api/users', (req, res) => {
  // Simulate user creation
  setTimeout(() => {
    res.status(201).json({ 
      id: Math.floor(Math.random() * 1000),
      message: 'User created successfully' 
    });
  }, Math.random() * 200);
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});