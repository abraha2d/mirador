# Generated by Django 3.1.5 on 2021-01-20 04:16

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("detection", "0002_add_schedule_links"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="alprsettings",
            options={
                "verbose_name": "ALPR settings",
                "verbose_name_plural": "ALPR settings",
            },
        ),
        migrations.AlterModelOptions(
            name="facedetectionsettings",
            options={"verbose_name_plural": "Face detection settings"},
        ),
        migrations.AlterModelOptions(
            name="motiondetectionsettings",
            options={"verbose_name_plural": "Motion detection settings"},
        ),
        migrations.AlterModelOptions(
            name="objectdetectionsettings",
            options={"verbose_name_plural": "Object detection settings"},
        ),
        migrations.AlterModelOptions(
            name="sounddetectionsettings",
            options={"verbose_name_plural": "Sound detection settings"},
        ),
    ]
