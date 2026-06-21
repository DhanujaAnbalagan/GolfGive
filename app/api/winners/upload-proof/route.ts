import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verificationService } from '@/services/verificationService';

/**
 * POST /api/winners/upload-proof
 * Users upload scorecard proof for their own winning claims.
 * Expects a FormData body with:
 * - 'file': The scorecard screenshot/image/PDF
 * - 'winnerId': The ID of the winner record
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const winnerId = formData.get('winnerId') as string | null;

    if (!file || !winnerId) {
      return NextResponse.json({ error: 'Missing file or winnerId in request' }, { status: 400 });
    }

    // 1. Ownership & Draw Validation
    const { data: winner, error: winnerError } = await supabase
      .from('winners')
      .select('user_id, verification_status')
      .eq('id', winnerId)
      .maybeSingle();

    if (winnerError || !winner) {
      return NextResponse.json({ error: winnerError?.message || 'Winner record not found' }, { status: 404 });
    }

    if (winner.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden. You do not own this record.' }, { status: 403 });
    }

    if (winner.verification_status === 'approved') {
      return NextResponse.json({ error: 'This winner claim has already been approved.' }, { status: 400 });
    }

    // 2. Validate File Size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds maximum limit of 10MB' }, { status: 400 });
    }

    // 3. Validate File Format (jpg, jpeg, png, pdf)
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
    const fileName = file.name || 'proof';
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json({ error: 'Invalid file format. Only JPG, JPEG, PNG, and PDF are supported.' }, { status: 400 });
    }

    const allowedContentTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedContentTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file content-type. Only images and PDFs are allowed.' }, { status: 400 });
    }

    // 4. Read File buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // 5. Submit proof using verification service
    const { data, error } = await verificationService.submitProof(
      supabase,
      winnerId,
      user.id,
      fileBuffer,
      fileName,
      file.type
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
