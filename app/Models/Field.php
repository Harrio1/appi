<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Field extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'coordinates', 'area'];

    public function properties()
    {
        return $this->hasMany(Property::class);
    }
}
