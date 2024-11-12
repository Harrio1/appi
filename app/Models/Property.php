<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Property extends Model
{
    use HasFactory;

    protected $fillable = ['field_id', 'season_id', 'field_type', 'seed_color'];

    public function field()
    {
        return $this->belongsTo(Field::class);
    }

    public function season()
    {
        return $this->belongsTo(Season::class);
    }
} 