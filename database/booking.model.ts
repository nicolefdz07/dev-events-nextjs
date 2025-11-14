import mongoose, { Schema, Document, Model } from 'mongoose';

// TypeScript interface for the Booking document
export interface IBooking extends Document {
  eventId: mongoose.Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Booking schema
const bookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: function (email: string) {
          // RFC 5322 compliant email regex
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        },
        message: 'Please provide a valid email address',
      },
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

// Pre-save hook to validate that the referenced event exists
bookingSchema.pre('save', async function (next) {
  // Only validate eventId if it's modified or the document is new
  if (this.isModified('eventId')) {
    try {
      // Dynamically import Event model to avoid circular dependency
      const Event = mongoose.models.Event || (await import('./event.model')).default;
      
      const eventExists = await Event.exists({ _id: this.eventId });
      
      if (!eventExists) {
        return next(new Error('Referenced event does not exist'));
      }
    } catch (error) {
      return next(
        new Error(
          `Failed to validate event reference: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      );
    }
  }

  next();
});

// Create index on eventId for faster queries
bookingSchema.index({ eventId: 1 });

// Create compound index for efficient duplicate booking checks
bookingSchema.index({ eventId: 1, email: 1 });

// Create and export the Booking model
// Use mongoose.models to prevent model recompilation during hot reloads in development
const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;
