<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Field extends Model
{
    use HasFactory;

    protected $fillable = ['season_id', 'coordinates', 'color', 'name', 'field_type'];

    public function season()
    {
        return $this->belongsTo(Season::class);
    }

    public function seasonSeeds()
    {
        return $this->hasMany(SeasonPolygonSeed::class);
    }
}
