const { db } = require("../db");
const express = require("express");
const router = express.Router();
const { FieldValue } = require('firebase-admin/firestore');

const followBrand = async (brandId, userId) => {
    const brandDocRef = db.collection('brands').doc(brandId);
    const followerDocRef = brandDocRef.collection('followers').doc(userId);
    await followerDocRef.set({ dateCreated: FieldValue.serverTimestamp() });
  };
  
  router.post('/', async (req, res) => {
    const { brandId, userId } = req.body;
  
    if (!brandId || !userId) {
      return res.status(400).send('brandId and userId are required');
    }
  
    try {
      await followBrand(brandId, userId);
      res.status(200).send('Brand followed successfully');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error following brand');
    }
  });

  module.exports = router;