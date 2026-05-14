// controllers/institutionController.js
import Institution from "../models/Institution.js"; // your Mongoose model

export const getInstitutionProfile = async (req, res) => {
  try {
    const institution = await Institution.findById(req.user.id); // from auth middleware
    if (!institution) return res.status(404).json({ message: "Institution not found" });
    res.json({ user: institution });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateInstitutionProfile = async (req, res) => {
  try {
    const institution = await Institution.findById(req.user.id);
    if (!institution) return res.status(404).json({ message: "Institution not found" });

    const { name, email, domain, website, description, avatar } = req.body;
    institution.name = name || institution.name;
    institution.email = email || institution.email;
    institution.domain = domain || institution.domain;
    institution.website = website || institution.website;
    institution.description = description || institution.description;
    institution.avatar = avatar || institution.avatar;

    await institution.save();
    res.json({ user: institution, message: "Profile updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
