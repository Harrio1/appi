<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Field extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'coordinates', 'area', 'season_id'];

    public function properties()
    {
        return $this->hasMany(Property::class);
    }

    public function season()
    {
        return $this->belongsTo(Season::class);
    }
}
