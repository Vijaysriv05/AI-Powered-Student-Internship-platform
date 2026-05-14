import Internship from "../models/Internship.js";

export const createInternship = async (req, res) => {
  try {
    const internship = await Internship.create({ ...req.body, postedBy: req.user.id });
    res.status(201).json(internship);
  } catch (err) {
    res.status(500).json({ message: "Error creating internship", error: err.message });
  }
};

export const getAllInternships = async (req, res) => {
  try {
    const internships = await Internship.find().populate("postedBy", "name email");
    res.json(internships);
  } catch (err) {
    res.status(500).json({ message: "Error fetching internships", error: err.message });
  }
};
