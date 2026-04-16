const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema(
  {
    id: { type: String, 
      required: true, 
      unique: true 
    },
    name: { 
      type: String, 
      required: true, 
      index: true 
    },
    gender: { 
      type: String,
      required:true,
       default: null 
      },
    gender_probability: { 
      type: Number,
      required: true,
       default: null 
      },

    sample_size: { type: Number, 
      default: null 
    },
    age: { type: Number, 
      default: null 
    },
    age_group: { type: String, 
      default: null 
    },
    country_id: { type: String, 
      default: null 
    },
    country_probability: { type: Number,
       default: null
       },
    created_at: { type: Date, 
      default: () => new Date() },
  },
  { versionKey: false }
);

module.exports = mongoose.models.Profile || mongoose.model('Profile', ProfileSchema);

