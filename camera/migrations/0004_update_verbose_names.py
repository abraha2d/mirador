# Generated by Django 3.1.5 on 2021-01-20 04:16

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("camera", "0003_add_overlay_links"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="ptzsettings",
            options={
                "verbose_name": "PTZ settings",
                "verbose_name_plural": "PTZ settings",
            },
        ),
    ]
