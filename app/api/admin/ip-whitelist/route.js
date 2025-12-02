// app/api/admin/ip-whitelist/route.js
import { NextResponse } from 'next/server';
import { db } from '@/config/db';
import { adminIpWhitelistTable } from '@/config/schema';
import { eq } from 'drizzle-orm';

// Helper function to get client IP address
function getClientIP(request) {
  // Try various headers (for proxies, load balancers, etc.)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback (for local development)
  return request.headers.get('x-forwarded-for') || '127.0.0.1';
}

// GET - Check if current IP is whitelisted and get all whitelisted IPs
export async function GET(request) {
  try {
    const clientIP = getClientIP(request);
    
    // Check if current IP is whitelisted
    const whitelistedIP = await db
      .select()
      .from(adminIpWhitelistTable)
      .where(eq(adminIpWhitelistTable.ip_address, clientIP))
      .then(rows => rows[0]);
    
    const isWhitelisted = whitelistedIP && whitelistedIP.is_active;
    
    // Get all whitelisted IPs (for admin settings)
    const allWhitelistedIPs = await db
      .select()
      .from(adminIpWhitelistTable)
      .orderBy(adminIpWhitelistTable.created_at);
    
    return NextResponse.json({
      currentIP: clientIP,
      isWhitelisted,
      whitelistedIPs: allWhitelistedIPs,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check IP whitelist', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Add IP to whitelist
export async function POST(request) {
  try {
    const { ip_address, description, added_by } = await request.json();
    
    if (!ip_address) {
      return NextResponse.json(
        { error: 'IP address is required' },
        { status: 400 }
      );
    }
    
    // Check if IP already exists
    const existing = await db
      .select()
      .from(adminIpWhitelistTable)
      .where(eq(adminIpWhitelistTable.ip_address, ip_address))
      .then(rows => rows[0]);
    
    if (existing) {
      // Update existing entry
      const updated = await db
        .update(adminIpWhitelistTable)
        .set({
          description: description || existing.description,
          is_active: true,
          updated_at: new Date(),
        })
        .where(eq(adminIpWhitelistTable.id, existing.id))
        .returning();
      
      return NextResponse.json({
        success: true,
        message: 'IP address updated in whitelist',
        ip: updated[0],
      });
    }
    
    // Add new IP
    const newIP = await db
      .insert(adminIpWhitelistTable)
      .values({
        ip_address,
        description: description || 'Added via admin settings',
        added_by: added_by || 'admin',
        is_active: true,
      })
      .returning();
    
    return NextResponse.json({
      success: true,
      message: 'IP address added to whitelist',
      ip: newIP[0],
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add IP to whitelist', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove IP from whitelist
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ip_address = searchParams.get('ip_address');
    const id = searchParams.get('id');
    
    if (!ip_address && !id) {
      return NextResponse.json(
        { error: 'IP address or ID is required' },
        { status: 400 }
      );
    }
    
    if (id) {
      await db
        .delete(adminIpWhitelistTable)
        .where(eq(adminIpWhitelistTable.id, parseInt(id)));
    } else {
      await db
        .delete(adminIpWhitelistTable)
        .where(eq(adminIpWhitelistTable.ip_address, ip_address));
    }
    
    return NextResponse.json({
      success: true,
      message: 'IP address removed from whitelist',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to remove IP from whitelist', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update IP whitelist entry
export async function PATCH(request) {
  try {
    const { id, description, is_active } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }
    
    const updates = {};
    if (description !== undefined) updates.description = description;
    if (is_active !== undefined) updates.is_active = is_active;
    updates.updated_at = new Date();
    
    const updated = await db
      .update(adminIpWhitelistTable)
      .set(updates)
      .where(eq(adminIpWhitelistTable.id, id))
      .returning();
    
    return NextResponse.json({
      success: true,
      message: 'IP whitelist entry updated',
      ip: updated[0],
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update IP whitelist', details: error.message },
      { status: 500 }
    );
  }
}

