# Generated by Django 3.1.5 on 2021-01-24 05:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('camera', '0007_dont_require_overlays'),
    ]

    operations = [
        migrations.AlterField(
            model_name='stream',
            name='protocol',
            field=models.CharField(choices=[('rtsp', 'RTSP'), ('http', 'HTTP')], default='rtsp', max_length=4),
        ),
    ]
