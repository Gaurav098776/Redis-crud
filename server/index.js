import { createClient } from "redis";
import express from "express";

// Initialize Express application
const app = express();
app.use(express.json()); // Middleware to parse JSON body

// Create Redis client
const client = createClient();

// Handle Redis client errors
client.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

// Connect to Redis server
client.connect().then(() => {
  console.log("Connected to Redis");

  // Define POST endpoint for creating data in Redis
  app.post("/api/create", async (req, res) => {
    try {
      const { id, data } = req.body;

      // Store data in Redis hash
      await client.HSET(id, data);

      // Send success response
      res.status(200).send(`Data created for ID: ${id}`);

      // Optionally, retrieve and log the stored data
      const storedData = await client.HGETALL(id);   //  TO SEE the data in database -- hgetall 'id'
      console.log("Stored data:", storedData);
    } catch (error) {
      // Handle errors
      console.error("Error creating data:", error);
      res.status(500).send("Error creating data");
    }
  });

  // get api
  app.get('/api/get/:id',async(req,res)=>{
    try{
      const{id} =  req.params;
      const data = await client.HGETALL(id);
      console.log(data);
      if(data.length === 0){
        return res.status(404).json({message: 'No data found for this id'})
      }
      res.status(200).json(data);
    }catch(error){
      console.log('Error in api', error);
      res.status(500).json({error:'An error occurred while retrieving the data'})
    }
    
  })

  // delete

  app.delete('/api/delete/:id',async(req,res)=>{
    try{
      const{id} = req.params;
      //check if data exists or not
      const exists =  await client.exists(id);
      if (!exists) {
        return res.status(404).json({ message: 'No data found for this id' });
      }
      // delete hash

      const result =  await client.DEL(id);  //delete the key
      if(result === 1 ){
        res.status(200).json({ message: `Data for id ${id} deleted successfully` });
      }else {
        res.status(400).json({ message: `Failed to delete data for id ${id}` });
      }

    }catch(error){
      console.error('Error in /api/delete:', error);
      res.status(500).json({ error: 'An error occurred while deleting the data' });
    }
  })

  // update

  app.put('/api/update/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
  
      // Check if the hash exists
      const exists = await client.exists(id);
      if (!exists) {
        return res.status(404).json({ message: 'No data found for this id' });
      }
  
      // Validate that updates is an object and not empty
      if (typeof updates !== 'object' || Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'Invalid update data' });
      }
  
      // Update the hash
      const result = await client.hSet(id, updates);
  
      res.status(200).json({ 
        message: `Data for id ${id} updated successfully`,
        fieldsUpdated: result
      });
  
    } catch (error) {
      console.error('Error in /api/update:', error);
      res.status(500).json({ error: 'An error occurred while updating the data' });
    }
  });


  // Start Express server
  const PORT = 5050;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch((err) => {
  console.error("Failed to connect to Redis:", err);
});
