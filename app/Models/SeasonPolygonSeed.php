<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SeasonPolygonSeed extends Model
{
    use HasFactory;

    protected $fillable = ['season_id', 'polygon_id', 'seed_type'];

    public function season()
    {
        return $this->belongsTo(Season::class);
    }

    public function polygon()
    {
        return $this->belongsTo(Field::class);
    }
}
