# Generated by Django 3.1.5 on 2021-01-20 03:09

import colorfield.fields
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Overlay",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("enabled", models.BooleanField()),
                ("format", models.CharField(max_length=255)),
                ("x_pos", models.PositiveSmallIntegerField()),
                ("y_pos", models.PositiveSmallIntegerField()),
                (
                    "color",
                    colorfield.fields.ColorField(default="#FFFFFFFF", max_length=18),
                ),
            ],
        ),
    ]
