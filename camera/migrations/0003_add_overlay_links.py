# Generated by Django 3.1.5 on 2021-01-20 03:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('overlay', '0001_initial'),
        ('camera', '0002_add_detection_links'),
    ]

    operations = [
        migrations.AddField(
            model_name='camera',
            name='overlays',
            field=models.ManyToManyField(to='overlay.Overlay'),
        ),
    ]
