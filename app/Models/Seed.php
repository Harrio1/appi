<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Seed extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    public function seedColors()
    {
        return $this->hasMany(SeedColor::class);
    }

    public function colors()
    {
        return $this->hasMany(SeedColor::class);
    }

    public function getColor()
    {
        return $this->colors()->first()->color ?? 'default_color';
    }
} 