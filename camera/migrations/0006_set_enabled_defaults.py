# Generated by Django 3.1.5 on 2021-01-23 03:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('camera', '0005_restructure_camera_detection_links'),
    ]

    operations = [
        migrations.AlterField(
            model_name='ptzsettings',
            name='enabled',
            field=models.BooleanField(),
        ),
    ]