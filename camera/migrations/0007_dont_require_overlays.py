# Generated by Django 3.1.5 on 2021-01-23 05:14

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("overlay", "0003_allow_negative_positions"),
        ("camera", "0006_set_enabled_defaults"),
    ]

    operations = [
        migrations.AlterField(
            model_name="camera",
            name="overlays",
            field=models.ManyToManyField(blank=True, to="overlay.Overlay"),
        ),
        migrations.AlterField(
            model_name="stream",
            name="enabled",
            field=models.BooleanField(),
        ),
    ]
