const { join } = require("path");
const router = require("express").Router();
const Farmer = require(join(__dirname, "..", "models", "Farmer"));
const { verifyFarmer } = require(join(__dirname, "..", "middleware", "auth"));

router.post("/crop", verifyFarmer, async (req, res) => {
  const { name, description, details, location, openToContractFarming } = req.body;
  if (!details.howOld || !details.estimatedTime) {
    return res.status(400).json({ message: "Details must be in this format: { howOld: String, estimatedTime: String }" });
  }
  if (!location.city || !location.state || !location.disctrict) 
    return res.status(400).json({ message: "Location must be in this format: { city: String, state: String, disctrict: String }" });
  if (!name || !description || !details || !location || !openToContractFarming)
    return res.status(400).json({ message: "All fields are required" });

  try {
    const farmer = await Farmer.findOne({ _id: req.user.user.id });
    if (!farmer) {
      // create new
      const newFarmer = new Farmer({
        _id: req.user.user.id,
        crops: [{
          name,
          description,
          details,
          location,
        }],
        openToContractFarming
      });
      await newFarmer.save();
    }
    
    const cropExists = farmer.crops.find(crop => crop.name === name);
    console.log(cropExists);
    if (cropExists) {
      return res.status(400).json({ message: "Crop already exists" });
    }
    const updatedFarmer = await Farmer.findOneAndUpdate(
      { _id: req.user.user.id },
      { $push: { crops: [{ name, description, details, location }] } },
      { new: true }
    );

    return res.status(201).json({ message: "Farmer updated successfully" });
  
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }

});

// above works

router.get("/crop", verifyFarmer, async (req, res) => { // works
  await Farmer.findOne({ farmer: req.user.user.id })
    .then(farmer => {
      return res.status(200).json({ name: req.user.name, farmer });
    })
    .catch(error => {
      console.log(error);
      return res.status(500).json({ message: "Something went wrong" });
    });
});

router.put("/crop", verifyFarmer, async (req, res) => {
    
  const { name, description, details, location, openToContractFarming } = req.body;
  if (!details.howOld || !details.estimatedTime) {
    return res.status(400).json({ message: "Details must be in this format: { howOld: String, estimatedTime: String }" });
  }
  if (!location.city || !location.state || !location.disctrict) 
    return res.status(400).json({ message: "Location must be in this format: { city: String, state: String, disctrict: String }" });

  Farmer.findOneAndUpdate({
    farmer: req.user.user.id,
    "crops.name": name
  }, {
    $set: {
      "crops.$.name": name,
      "crops.$.description": description,
      "crops.$.details": details,
      "crops.$.location": location,
      "crops.$.openToContractFarming": openToContractFarming
    }
  }, { new: true })
    .then(farmer => { 
      return res.status(201).json({ message: "Crop updated successfully" });
    })
    .catch(error => {
      console.log(error);
      return res.status(500).json({ message: "Something went wrong" });
    });
});

// router.delete('/crop', verifyFarmer, async (req, res) => {

// });

module.exports = router;