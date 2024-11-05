<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SeedColor extends Model
{
    use HasFactory;

    protected $fillable = ['seed_id', 'color'];

    public function seed()
    {
        return $this->belongsTo(Seed::class);
    }
} 