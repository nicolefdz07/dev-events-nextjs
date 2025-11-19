import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event, { IEvent } from '@/database/event.model';

// Type definition for route params
type RouteParams = {
    params: Promise<{
        slug: string;
    }>;
};

/**
 * GET /api/events/[slug]
 * Fetches a single event by its slug
 */
export async function GET(
    req: NextRequest,
    { params }: RouteParams
): Promise<NextResponse<{ message: string; event?: IEvent; error?: string }>> {
    try {
        // Await params to extract slug
        const { slug } = await params;

        // Validate slug parameter
        if (!slug || typeof slug !== 'string') {
            return NextResponse.json(
                { message: 'Invalid slug parameter', error: 'Slug must be a non-empty string' },
                { status: 400 }
            );
        }

        // Validate slug format (alphanumeric and hyphens only)
        const slugRegex = /^[a-z0-9-]+$/;
        if (!slugRegex.test(slug)) {
            return NextResponse.json(
                { message: 'Invalid slug format', error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
                { status: 400 }
            );
        }
        // sanitize slug (Remove any potential malicious input)
        const sanitizedSlug: string = slug.trim().toLowerCase();

        // Connect to database
        await connectDB();

        // Query event by slug
        const event = await Event.findOne({slug: sanitizedSlug}).lean<IEvent>();

        // Handle event not found
        if (!event) {
            return NextResponse.json(
                { message: 'Event not found', error: `No event found with slug: ${slug}` },
                { status: 404 }
            );
        }

        // Return event data
        return NextResponse.json(
            { message: 'Event fetched successfully', event },
            { status: 200 }
        );
    } catch (error) {
        // Log error for debugging
        console.error('Error fetching event by slug:', error);

        // Handle unexpected errors
        return NextResponse.json(
            {
                message: 'Failed to fetch event',
                error: error instanceof Error ? error.message : 'An unexpected error occurred'
            },
            { status: 500 }
        );
    }
}
