<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\SeasonPolygonSeed;
use App\Models\Field;

class Season extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    public function polygonSeeds()
    {
        return $this->hasMany(SeasonPolygonSeed::class);
    }

    public function fields()
    {
        return $this->hasMany(Field::class);
    }
}
