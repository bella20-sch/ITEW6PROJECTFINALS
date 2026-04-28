# Smart Eligibility Tagging (Laravel Suggestion)

If you move this feature into `student-profiling-api` (Laravel), use a polymorphic tag model so tags can be attached to students and other future entities.

## Suggested tables

- `tags` (`id`, `name`, `slug`, `type`, timestamps)
- `taggables` (`tag_id`, `taggable_type`, `taggable_id`, `weight`, timestamps)

`weight` supports weighted skill tags (example: Leadership = 0.8, Basketball = 1.0).

## Example migration

```php
Schema::create('tags', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('slug')->unique();
    $table->string('type')->default('skill'); // skill, trait, etc.
    $table->timestamps();
});

Schema::create('taggables', function (Blueprint $table) {
    $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
    $table->morphs('taggable'); // taggable_type + taggable_id
    $table->decimal('weight', 5, 2)->default(1.00);
    $table->timestamps();
    $table->primary(['tag_id', 'taggable_type', 'taggable_id'], 'taggables_primary');
});
```

## Example model relation

```php
// Student.php
public function tags()
{
    return $this->morphToMany(Tag::class, 'taggable')->withPivot('weight')->withTimestamps();
}
```

This keeps skills extensible for Smart Eligibility filters without schema changes for every new tag type.
